using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.Models;

// Keep image bytes out of normal student-directory and recommendation queries.
public class StudentPhoto
{
    [Key]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;
    [MaxLength(32)]
    public string ContentType { get; set; } = string.Empty;
    public byte[] Data { get; set; } = [];
}
