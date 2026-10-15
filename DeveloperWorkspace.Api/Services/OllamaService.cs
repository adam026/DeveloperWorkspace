
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace DeveloperWorkspace.Api.Services;

public sealed class OllamaService
{
    private readonly HttpClient _httpClient;

    public OllamaService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<string> SummarizeAsync(
        string text,
        CancellationToken cancellationToken = default)
    {
        var request = new OllamaRequest(
            Model: "llama3.2:3b",
            Prompt: $"""
                You are an experienced software developer
                specializing in technical documentation.

                Create a concise, informative English summary
                of the following document.

                Requirements:
                - Write 3-5 sentences.
                - Highlight the main topic and key findings.
                - Do not reproduce the entire document.
                - Do not repeat the document title, category,
                  or metadata.
                - Use clear and technically accurate English.
                - Do not introduce information unsupported
                  by the source document.
                - Return only the summary, without a heading
                  or introductory text.

                Document:
                {text}
                """,
            Stream: false);

        using var response = await _httpClient.PostAsJsonAsync(
            "api/generate",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaResponse>(
            cancellationToken: cancellationToken);

        return result?.Response
            ?? throw new InvalidOperationException(
                "Ollama did not return a summary.");
    }

    public async Task<string> GenerateMarkdownAsync(
        string fileType,
        string name,
        string description,
        string requirements,
        CancellationToken cancellationToken = default)
    {
        var typeInstructions = fileType switch
        {
            "Agent" => """
                Generate a valid GitHub Copilot custom agent profile.

                The file must follow this structure:

                ---
                name: <agent-name>
                description: <concise description>
                ---

                # <Agent Name>

                ## Role
                Describe the agent's specific responsibilities based on
                the user-provided requirements.

                ## Goal
                State the concrete outcome the agent must achieve.

                ## Execution Workflow
                Define a strictly ordered, numbered sequence of actionable
                steps that achieves the user's requested goal.

                ## Constraints
                List the user's explicit constraints and any additional
                constraints directly relevant to the requested task.

                ## Validation
                Define concrete checks that determine whether the requested
                task has been completed successfully.

                Follow these rules:
                - The user's requirements define the primary purpose of the agent.
                - Do not replace the requested task with generic security,
                  safety, or maintainability advice.
                - Include security and safety checks only when relevant
                  to the requested task or explicitly required.
                - Preserve the user's requested priorities and execution order.
                - Every workflow step must contribute to the agent's goal.
                - Do not claim that tests or validation were performed
                  unless the agent actually performed them.
                - Replace all template descriptions with concrete content.
                - Never output placeholder text such as
                  "Describe the agent's specific responsibilities".
                - Do not include the explanatory template text in the result.
                - Use valid YAML frontmatter with separate name and description
                  lines and exactly one closing delimiter before the body.
                - Return only the Markdown file content.
                """,

            "Domain" => """
                Create structured domain knowledge documentation.
                Cover domain concepts, relationships, business rules,
                and relevant technical context.
                Do not invent domain information.
                """,

            "HowTo" => """
                Create a practical, step-by-step technical guide.
                Make every step actionable and include expected
                or verifiable outcomes where appropriate.
                """,

            "Rule" => """
                Create a GitHub Copilot instruction file.
                Define clear, specific, and enforceable rules.
                Include valid frontmatter and file-matching patterns
                when they are required by the intended scope.
                """,

            "Skill" => """
                Create a GitHub Copilot skill file named SKILL.md.
                Include valid YAML frontmatter with a concise,
                informative description, followed by a reusable
                and detailed workflow with ordered steps.
                """,

            "CopilotInstructions" => """
                Create a repository-level copilot-instructions.md.
                Describe general project conventions, technologies,
                architecture, and mandatory development rules.
                Include only information supported by the input.
                """,

            _ => throw new ArgumentException(
                "Unsupported Markdown file type.",
                nameof(fileType))
        };

        var prompt = $"""
            CRITICAL LANGUAGE REQUIREMENT:
            The complete output MUST be written in English.
            The user's input may be in Hungarian or another language.
            Always translate and interpret the user's requirements into English
            before generating the file.
            Never write Hungarian text in the generated Markdown document.

            You are an experienced software architect and
            GitHub Copilot instruction designer.

            Your task is to generate a usable Markdown file.

            File type: {fileType}
            Name: {name}
            Description: {description}

            User requirements:
            {requirements}

            File-type-specific instructions:
            {typeInstructions}

            General requirements:
            - Write the entire document in English.
            - Do not invent project details or requirements.
            - Use clear, well-structured Markdown.
            - Follow the conventions of the selected file type.
            - Return only the final file content.
            - Never wrap the entire response in a Markdown code fence.
            - Never copy template instructions or explanatory text into the output.
            - Replace every template section with meaningful,
              task-specific content derived from the user requirements.
            - Do not include placeholders such as "Describe the agent's role"
              or "Describe the intended outcome".
            - Do not include generic filler text.
            - Do not add generic requirements that override the user's intent.
            - Preserve the user's requested priorities and execution order.
            - For Agent files, generate valid YAML frontmatter containing
              separate name and description fields.
            - For Agent files, use exactly one opening "---" delimiter
              and one closing "---" delimiter before the Markdown body.
            - Ensure the frontmatter ends before the first Markdown heading.
            - Before returning the result, check for malformed frontmatter,
              duplicate delimiters, missing content, and template placeholders.
            """;

        var request = new OllamaRequest(
            Model: "llama3.2:3b",
            Prompt: prompt,
            Stream: false);

        using var response = await _httpClient.PostAsJsonAsync(
            "api/generate",
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaResponse>(
            cancellationToken: cancellationToken);


        var content = result?.Response
            ?? throw new InvalidOperationException(
                "Ollama did not return Markdown content.");

        return NormalizeMarkdown(content, fileType);

    }

    private sealed record OllamaRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("prompt")] string Prompt,
        [property: JsonPropertyName("stream")] bool Stream);

    private sealed record OllamaResponse(
        [property: JsonPropertyName("response")] string Response);


    private static string NormalizeMarkdown(string content, string fileType)
    {
        content = content.Trim();

        // Remove an outer Markdown code fence if the model added one.
        if (content.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewLine = content.IndexOf('\n');

            if (firstNewLine >= 0)
            {
                content = content[(firstNewLine + 1)..].Trim();

                if (content.EndsWith("```", StringComparison.Ordinal))
                {
                    content = content[..^3].TrimEnd();
                }
            }
        }

        // Normalize the opening YAML frontmatter for agent files.
        if (string.Equals(fileType, "Agent", StringComparison.OrdinalIgnoreCase))
        {
            content = NormalizeAgentFrontmatter(content);
        }

        return content.Trim() + Environment.NewLine;
    }


    private static string NormalizeAgentFrontmatter(string content)
    {
        content = content.Trim();

        // Remove an existing opening frontmatter delimiter.
        if (content.StartsWith("---", StringComparison.Ordinal))
        {
            content = content[3..].TrimStart('\r', '\n', ' ', '\t');
        }

        var lines = content
            .Replace("\r\n", "\n")
            .Split('\n')
            .ToList();

        // Find the existing frontmatter closing delimiter.
        var closingIndex = lines.FindIndex(line =>
            line.Trim() == "---");

        if (closingIndex >= 0)
        {
            // Keep exactly one opening and one closing delimiter.
            var metadata = lines.Take(closingIndex)
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .ToList();

            var body = lines.Skip(closingIndex + 1)
                .ToList();

            return string.Join(
                Environment.NewLine,
                new[] { "---" }
                    .Concat(metadata)
                    .Concat(new[] { "---", "" })
                    .Concat(body))
                .Trim();
        }

        // If no closing delimiter exists, do not invent metadata.
        return "---" + Environment.NewLine + content;
    }
}
