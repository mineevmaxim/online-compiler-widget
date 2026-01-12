FROM mcr.microsoft.com/dotnet/sdk:9.0

WORKDIR /src
COPY . .

# собираем и публикуем API
RUN dotnet restore CompilerWidgetApi/CompilerWidgetApi.csproj
RUN dotnet publish CompilerWidgetApi/CompilerWidgetApi.csproj -c Release -o /app

WORKDIR /app

EXPOSE 80
ENV ASPNETCORE_ENVIRONMENT=Development
ENV ASPNETCORE_URLS=http://+:80

ENTRYPOINT ["dotnet", "CompilerWidgetApi.dll"]
