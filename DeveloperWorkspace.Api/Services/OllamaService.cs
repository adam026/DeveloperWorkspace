
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
                Foglald össze magyarul az alábbi szöveget.
                Emeld ki a legfontosabb információkat.
                Ne találj ki olyan információt, amely nem szerepel a szövegben.

                Szöveg:
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
                "Az Ollama nem adott vissza összefoglalót.");
    }

    private sealed record OllamaRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("prompt")] string Prompt,
        [property: JsonPropertyName("stream")] bool Stream);

    private sealed record OllamaResponse(
        [property: JsonPropertyName("response")] string Response);
}

