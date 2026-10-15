
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeveloperWorkspace.Api.Models;

public class MarkdownDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("name")]
    [Required(ErrorMessage = "A fájl neve kötelező.")]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [BsonElement("fileType")]
    [Required(ErrorMessage = "A fájltípus megadása kötelező.")]
    [StringLength(50)]
    public string FileType { get; set; } = string.Empty;

    [BsonElement("description")]
    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("filePath")]
    [StringLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}
