using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Data;
using TeamFit.Api.Infrastructure;
using TeamFit.Api.Models;

namespace TeamFit.Api.Controllers;

[Authorize, ApiController]
[Route("api/students/{studentId:int}/photo")]
public class StudentPhotosController(TeamFitDbContext context) : ControllerBase
{
    private const int MaxBytes = 2 * 1024 * 1024;

    [HttpGet]
    public async Task<IActionResult> Get(int studentId)
    {
        var photo = await context.StudentPhotos.AsNoTracking().SingleOrDefaultAsync(x => x.StudentId == studentId);
        if (photo is null) return NotFound();
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(photo.Data, photo.ContentType);
    }

    [HttpPut]
    [RequestSizeLimit(3 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 3 * 1024 * 1024)]
    public async Task<IActionResult> Upload(int studentId, [FromForm] IFormFile file)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        if (file.Length is <= 0 or > MaxBytes)
            return BadRequest(new { message = "Choose a JPG or PNG image smaller than 2 MB." });
        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        var data = stream.ToArray();
        // Determine the response type from the bytes, never the supplied filename or MIME type.
        var png = data.Length >= 33 && data.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })
            && data.AsSpan(12, 4).SequenceEqual("IHDR"u8);
        var jpeg = data.Length >= 4 && data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff
            && data[^2] == 0xff && data[^1] == 0xd9;
        if (!png && !jpeg) return BadRequest(new { message = "Only JPG and PNG images are supported." });
        var photo = await context.StudentPhotos.FindAsync(studentId);
        if (photo is null) { photo = new StudentPhoto { StudentId = studentId }; context.StudentPhotos.Add(photo); }
        photo.Data = data;
        photo.ContentType = png ? "image/png" : "image/jpeg";
        student.PhotoVersion = Guid.NewGuid();
        await context.SaveChangesAsync();
        return Ok(new { student.PhotoVersion });
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(int studentId)
    {
        var student = await context.Students.FindAsync(studentId);
        if (student is null) return NotFound();
        if (student.UserId != CurrentUser.Id(User)) return Forbid();
        var photo = await context.StudentPhotos.FindAsync(studentId);
        if (photo is not null) context.StudentPhotos.Remove(photo);
        student.PhotoVersion = null;
        await context.SaveChangesAsync();
        return NoContent();
    }
}
