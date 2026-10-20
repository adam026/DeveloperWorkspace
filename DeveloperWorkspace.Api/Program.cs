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

            // DocumentService registration for dependency injection
            builder.Services.AddScoped<DocumentService>();

            // PromptService registration for dependency injection
            builder.Services.AddScoped<PromptService>();

            // MarkdownDocumentService registration for dependency injection
            builder.Services.AddScoped<MarkdownDocumentService>();

            // AgentService registration for dependency injection
            builder.Services.AddScoped<AgentService>();

            // ArchitectureProjectService registration for dependency injection
            builder.Services.AddScoped<ArchitectureProjectService>();

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
                client.BaseAddress = new Uri("http://localhost:11434/");
                client.Timeout = TimeSpan.FromMinutes(3);
            });

            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            var app = builder.Build();

            // Use the CORS policy for requests from the Angular frontend
            app.UseCors("AngularFrontend");

            // Add the exception handling middleware to the pipeline
            app.UseMiddleware<ExceptionHandlingMiddleware>();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();

                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/openapi/v1.json", "DeveloperWorkspace API v1");
                });
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
