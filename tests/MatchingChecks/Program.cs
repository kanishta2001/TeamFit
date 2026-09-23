using TeamFit.Api.Models;
using TeamFit.Api.Services;

// Small dependency-free regression checks for the pure scoring function.
var service = new MatchingService();
var react = new Skill { Id = 1, Name = "React" };
var sql = new Skill { Id = 2, Name = "SQL" };
var project = new ProjectRequest
{
    RequiredSkills = [new() { SkillId = 1, Skill = react }, new() { SkillId = 2, Skill = sql }],
    DesiredRoles = [new() { Role = "Frontend Developer" }],
    Availability = [new() { Slot = "Weekday Evening" }]
};
var student = new Student
{
    PreferredRole = "Frontend Developer",
    StudentSkills = [new() { SkillId = 1, Skill = react }],
    Availability = [new() { Slot = "Weekday Evening" }]
};
var checks = 0;
void Check(bool condition, string label)
{
    if (!condition) throw new InvalidOperationException("FAILED: " + label);
    checks++;
    Console.WriteLine("PASS: " + label);
}
var half = service.Score(project, student);
Check(half.Score == 70 && half.SkillScore == 30, "half skills + role + availability = 70");
Check(half.MissingSkills.Single().Name == "SQL", "missing skills are explained");
student.StudentSkills.Add(new() { SkillId = 2, Skill = sql });
Check(service.Score(project, student).Score == 100, "all dimensions = 100");
project.RequiredSkills.Add(new() { SkillId = 1, Skill = react });
Check(service.Score(project, student).Score == 100, "duplicate requirements cannot inflate score");
student.PreferredRole = "frontend developer";
Check(service.Score(project, student).RoleMatched, "role comparison is case-insensitive");
student.Availability.Clear();
Check(service.Score(project, student).Score == 85, "no shared time earns no availability points");
student.StudentSkills.Clear();
student.PreferredRole = "QA Tester";
Check(service.Score(project, student).Score == 0, "no matches = 0");
project.RequiredSkills.Clear();
Check(service.Score(project, student).Score == 0, "empty requirements do not divide by zero");
Check(project.Members.Count == 0 && student.StudentSkills.Count == 0, "scoring does not mutate membership or skills");
Console.WriteLine($"Passed {checks} matching checks.");
