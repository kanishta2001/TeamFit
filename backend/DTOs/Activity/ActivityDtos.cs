namespace TeamFit.Api.DTOs.Activity;

public class ActivityFeedItem
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Href { get; set; } = "/dashboard";
}

public class NotificationSummary
{
    public int UnreadCount { get; set; }
    public IReadOnlyList<ActivityFeedItem> Items { get; set; } = [];
}
