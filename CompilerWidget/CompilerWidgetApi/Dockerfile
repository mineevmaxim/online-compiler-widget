FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["CompilerWidgetApi/CompilerWidgetApi.csproj", "CompilerWidgetApi/"]
COPY ["FileStorage/FileStorage.csproj", "FileStorage/"]
COPY ["Compilation/Compilation.csproj", "Compilation/"]
COPY ["*.sln", "./"]
RUN dotnet restore "CompilerWidgetApi/CompilerWidgetApi.csproj"

COPY . .
WORKDIR "/src/CompilerWidgetApi"
RUN dotnet build "CompilerWidgetApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CompilerWidgetApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 5240
ENTRYPOINT ["dotnet", "CompilerWidgetApi.dll"]
