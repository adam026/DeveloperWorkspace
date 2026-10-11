
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeveloperWorkspace.Api.Models;

public class Prompt
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    [Required(ErrorMessage = "A prompt címe kötelező.")]
    [StringLength(150, ErrorMessage = "A cím legfeljebb 150 karakter lehet.")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    [StringLength(500, ErrorMessage = "A leírás legfeljebb 500 karakter lehet.")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("category")]
    [StringLength(100, ErrorMessage = "A kategória legfeljebb 100 karakter lehet.")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("content")]
    [Required(ErrorMessage = "A prompt szövege kötelező.")]
    [StringLength(20000, ErrorMessage = "A prompt legfeljebb 20 000 karakter lehet.")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime? UpdatedAt { get; set; }
}
