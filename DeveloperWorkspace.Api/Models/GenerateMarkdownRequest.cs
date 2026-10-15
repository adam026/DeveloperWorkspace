using System.ComponentModel.DataAnnotations;

namespace DeveloperWorkspace.Api.Models;

public class GenerateMarkdownRequest
{
    [Required]
    [StringLength(50)]
    public string FileType { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [StringLength(20000, MinimumLength = 10)]
    public string Requirements { get; set; } = string.Empty;

    [StringLength(500)]
    public string FilePath { get; set; } = string.Empty;
}

