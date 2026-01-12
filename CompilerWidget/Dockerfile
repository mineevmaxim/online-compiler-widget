# Добавь копирование папки Migrations
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore CompilerWidgetApi/CompilerWidgetApi.csproj
WORKDIR /src/CompilerWidgetApi
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Копируем опубликованное приложение
COPY --from=build /app/publish .

# Копируем папку Migrations (важно!)
COPY --from=build /src/FileStorage/Migrations /app/FileStorage/Migrations

EXPOSE 80
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

ENTRYPOINT ["dotnet", "CompilerWidgetApi.dll"]