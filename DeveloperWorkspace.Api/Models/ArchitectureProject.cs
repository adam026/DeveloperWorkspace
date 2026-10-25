
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeveloperWorkspace.Api.Models
{
    public class ArchitectureProject
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public List<ArchitectureComponent> Components { get; set; } = new();

        public List<ArchitectureConnection> Connections { get; set; } = new();

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    public class ArchitectureComponent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Name { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public double X { get; set; }

        public double Y { get; set; }

        public double Width { get; set; } = 190;

        public double Height { get; set; } = 72;

        public Dictionary<string, string> Properties { get; set; } = new();
    }

    public class ArchitectureConnection
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string SourceComponentId { get; set; } = string.Empty;

        public string TargetComponentId { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public string? Label { get; set; }

        public string Direction { get; set; } = "forward";
    }
}
