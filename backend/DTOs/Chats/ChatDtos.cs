using System.ComponentModel.DataAnnotations;

namespace TeamFit.Api.DTOs.Chats;

public class ChatMessageInput
{
    [Required, StringLength(1000, MinimumLength = 1)]
    public string Body { get; set; } = string.Empty;
}

public class ChatThreadResponse
{
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public int UnreadCount { get; set; }
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
}

public class ChatMessageResponse
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsMine { get; set; }
}
