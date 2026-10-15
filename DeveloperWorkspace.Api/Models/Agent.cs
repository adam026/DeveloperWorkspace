
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeveloperWorkspace.Api.Models;

public class Agent
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    [Required(ErrorMessage = "Az agent neve kötelező.")]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [BsonElement("description")]
    [StringLength(500)]
    public string Description { get; set; } = string.Empty;

    [BsonElement("role")]
    [Required(ErrorMessage = "Az agent szerepköre kötelező.")]
    [StringLength(200)]
    public string Role { get; set; } = string.Empty;

    [BsonElement("goal")]
    [Required(ErrorMessage = "Az agent célja kötelező.")]
    [StringLength(2000)]
    public string Goal { get; set; } = string.Empty;

    [BsonElement("techStack")]
    public List<string> TechStack { get; set; } = [];

    [BsonElement("instructions")]
    [StringLength(10000)]
    public string Instructions { get; set; } = string.Empty;

    [BsonElement("constraints")]
    [StringLength(5000)]
    public string Constraints { get; set; } = string.Empty;

    [BsonElement("generatedContent")]
    public string GeneratedContent { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}

