using System.Net.Mail;
using System.Net;

using Microsoft.Extensions.Configuration;

namespace Purse.Backend.Services;

public class EmailNotificationService
{
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;

    public EmailNotificationService(IConfiguration config)
    {
        _host = config["Smtp:Host"]!;
        _port = int.Parse(config["Smtp:Port"]!);
        _username = config["Smtp:Username"]!;
        _password = config["Smtp:Password"]!;
    }

    public bool SendNotification(string? toEmail, string subject, string messageText)
    {
        if (string.IsNullOrEmpty(toEmail)) return false;
        try
        {
            var message = new MailMessage();
            message.To.Add(toEmail);
            message.Subject = subject;
            message.From = new MailAddress(_username, "Purse App");
            message.IsBodyHtml = true;
            message.Body = "<html><body style='background-color:#e9e9e9;'>"
                + "<table style='background-color:white;width:99%;margin:0.5%;border-radius:10px;padding:15px;'>"
                + "<tr><td style='text-align:left;font-family:Calibri;'>Bonjour,<br><br>"
                + messageText
                + "<br><br>Meilleures salutations.<br><hr>"
                + "</td></tr></table></body></html>";

            var smtp = new SmtpClient("smtp.office365.com")
            {
                Port = 587,
                Credentials = new System.Net.NetworkCredential("eci.hrms@ecintl.com", "4PGKaAb9123"),
                EnableSsl = true
            };
          
            smtp.Send(message);
            return true;
        }
        catch (Exception ex)
        {
            // Console.WriteLine("Erreur envoi email : " + ex.Message);
            // return false;
            Console.WriteLine($"❌ EMAIL FAILED → To: {toEmail} | Error: {ex.GetType().Name}: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"   Inner: {ex.InnerException.Message}");
            return false;
        }
    }
}