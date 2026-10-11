
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
                Te egy tapasztalt szoftverfejlesztő vagy, aki technikai dokumentációkat foglal össze.

                Készíts magyar nyelvű, tömör és informatív összefoglalót az alábbi dokumentumról.

                Követelmények:
                - Az összefoglaló 3-5 mondatból álljon.
                - A dokumentum fő témáját és legfontosabb újdonságait emeld ki.
                - Ne ismételd meg a teljes leírást, és ne sorold fel az összes részletet.
                - Ne ismételd vissza a dokumentum címét, kategóriáját vagy metaadatait.
                - Használj természetes, szakmailag pontos magyar nyelvet.
                - Ne adj hozzá olyan információt, amely nem következik a bemenetből.
                - Kizárólag az összefoglalót add vissza, bevezető és külön cím nélkül.

                Dokumentum:
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

