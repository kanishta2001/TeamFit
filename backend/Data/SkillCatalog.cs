using Microsoft.EntityFrameworkCore;
using TeamFit.Api.Models;

namespace TeamFit.Api.Data;

// This is the single source of truth for skills exposed by the API and accepted on writes.
public static class SkillCatalog
{
    public static readonly (string Category, string[] Names)[] Groups =
    [
        ("Frontend", ["React", "Next.js", "Angular", "Vue.js", "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Material UI"]),
        ("Programming Languages", ["JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "C", "PHP", "Go", "Kotlin", "Swift", "Dart", "Ruby"]),
        ("Backend", ["ASP.NET Core", "Node.js", "Express.js", "Spring Boot", "Django", "Flask", "Laravel", "NestJS"]),
        ("Mobile Development", ["Flutter", "React Native", "Android Studio", "Kotlin", "Swift", "SwiftUI"]),
        ("Databases", ["MySQL", "PostgreSQL", "SQL Server", "MongoDB", "Firebase", "SQLite", "Redis", "Oracle Database"]),
        ("Cloud Platforms", ["AWS", "Microsoft Azure", "Google Cloud Platform", "Firebase", "Vercel", "Netlify"]),
        ("DevOps & Deployment", ["Docker", "Kubernetes", "Jenkins", "GitHub Actions", "GitLab CI/CD", "Azure DevOps", "Terraform"]),
        ("Version Control", ["Git", "GitHub", "GitLab", "Bitbucket"]),
        ("API & Testing Tools", ["REST API", "GraphQL", "Postman", "Swagger/OpenAPI", "Insomnia"]),
        ("Testing", ["Selenium", "Cypress", "Playwright", "Jest", "xUnit", "NUnit", "JUnit", "PyTest"]),
        ("Project Management", ["Jira", "Trello", "Asana", "ClickUp", "Microsoft Project", "Monday.com"]),
        ("UI/UX & Design", ["Figma", "Adobe XD", "Canva", "Photoshop", "Illustrator"]),
        ("Analysis & Diagramming", ["draw.io", "Lucidchart", "Microsoft Visio", "StarUML", "UML", "ER Diagrams", "BPMN"]),
        ("Development Environments", ["Visual Studio Code", "Visual Studio", "IntelliJ IDEA", "PyCharm", "Eclipse", "Android Studio"]),
        ("Data & Analytics", ["Microsoft Excel", "Power BI", "Tableau", "Pandas", "NumPy"]),
        ("Collaboration", ["Microsoft Teams", "Slack", "Discord", "Notion", "Confluence"]),
        ("AI Development", ["OpenAI API", "Hugging Face", "TensorFlow", "PyTorch", "LangChain"]),
        ("Software Development Practices", ["Agile", "Scrum", "Kanban", "CI/CD", "Git Flow", "RESTful Architecture", "MVC", "Clean Architecture", "Microservices"])
    ];

    private static readonly Dictionary<string, (string Name, string[] Categories)> Entries =
        Groups.SelectMany(group => group.Names.Select(name => (group.Category, Name: name)))
            .GroupBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key,
                group => (group.First().Name, group.Select(item => item.Category).Distinct().ToArray()),
                StringComparer.OrdinalIgnoreCase);

    public static bool Contains(string name) => Entries.ContainsKey(name);
    public static string CanonicalName(string name) => Entries.TryGetValue(name, out var entry) ? entry.Name : name;
    public static string[] CategoriesFor(string name) =>
        Entries.TryGetValue(name, out var entry) ? entry.Categories : [];

    public static async Task SeedAsync(TeamFitDbContext context)
    {
        var existing = (await context.Skills.Select(skill => skill.Name).ToListAsync())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var name in Entries.Keys.Where(name => !existing.Contains(name)))
            context.Skills.Add(new Skill { Name = name });
        await context.SaveChangesAsync();
    }
}
