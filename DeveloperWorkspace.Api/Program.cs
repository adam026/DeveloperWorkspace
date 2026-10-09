
using DeveloperWorkspace.Api.Data;
using DeveloperWorkspace.Api.Services;

namespace DeveloperWorkspace.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();

            // DocumentService registration for dependency injection
            builder.Services.AddScoped<DocumentService>();

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

            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();

            var app = builder.Build();

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
