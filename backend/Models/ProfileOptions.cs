namespace TeamFit.Api.Models;

// Shared choices keep profile filters and matching rules consistent.
public static class ProfileOptions
{
    public static readonly string[] Roles =
    [
        "Frontend Developer", "Backend Developer", "Full-stack Developer",
        "UI/UX Designer", "Database Developer", "QA Tester", "Project Manager"
    ];

    public static readonly string[] AvailabilitySlots =
    [
        "Weekday Morning", "Weekday Afternoon", "Weekday Evening",
        "Weekend Morning", "Weekend Afternoon", "Weekend Evening"
    ];
}
