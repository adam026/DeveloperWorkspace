using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Middleware;
using DeveloperWorkspace.Api.Services;

namespace DeveloperWorkspace.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Allow requests from the Angular frontend running on localhost:4200
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AngularFrontend", policy =>
                {
                    policy
                        .WithOrigins("http://localhost:4200")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            // Add services to the container.
            builder.Services.AddControllers();

            // Service registrations for dependency injection
            builder.Services.AddScoped<DocumentService>();
            builder.Services.AddScoped<PromptService>();
            builder.Services.AddScoped<MarkdownDocumentService>();
            builder.Services.AddScoped<ArchitectureProjectService>();
            builder.Services.AddScoped<DocumentationProjectService>();
            builder.Services.AddScoped<ProjectDocumentationService>();
            builder.Services.AddScoped<TaskService>();

            // MongoDbContext registration with configuration from appsettings.json
            builder.Services.AddSingleton<MongoDbContext>(sp =>
            {
                var configuration = sp.GetRequiredService<IConfiguration>();

                var settings = configuration
                    .GetSection("MongoDbSettings")
                    .Get<MongoDbSettings>()
                    ?? throw new InvalidOperationException(
                        "MongoDbSettings configuration is missing.");

                return new MongoDbContext(settings);
            });

            // OllamaService registration with HttpClient configuration
            builder.Services.AddHttpClient<OllamaService>(client =>
            {
                var ollamaUrl = builder.Configuration["Ollama:BaseUrl"]
                    ?? "http://localhost:11434/";

                client.BaseAddress = new Uri(ollamaUrl);
                client.Timeout = TimeSpan.FromMinutes(3);
            });

            builder.Services.AddOpenApi();

            var app = builder.Build();

            // Use the CORS policy for requests from the Angular frontend
            app.UseCors("AngularFrontend");

            // Add the exception handling middleware to the pipeline
            app.UseMiddleware<ExceptionHandlingMiddleware>();

            // Configure the HTTP request pipeline.
            app.MapOpenApi();

            app.UseSwaggerUI(options =>
            {
                options.SwaggerEndpoint("/openapi/v1.json", "DeveloperWorkspace API v1");
            });

            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
