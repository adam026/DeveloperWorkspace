using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeveloperWorkspace.Api.Models;

public class Task
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "To Do";

    public string Priority { get; set; } = "Medium";

    public string? ProjectId { get; set; }

    public DateTime? DueDate { get; set; }

    public List<string> Tags { get; set; } = [];

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}