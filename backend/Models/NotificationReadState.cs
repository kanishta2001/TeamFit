namespace TeamFit.Api.Models;

public class NotificationReadState
{
    public int UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public DateTime LastReadAt { get; set; } = DateTime.UtcNow;
}
