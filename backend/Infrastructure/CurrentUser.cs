using System.Security.Claims;

namespace TeamFit.Api.Infrastructure;

public static class CurrentUser
{
    public static int Id(ClaimsPrincipal principal) =>
        int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException());
}
