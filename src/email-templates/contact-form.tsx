export function render(data: any) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Subject:</b> ${data.subject}</p>
      <br /><br />
      <p>${data.message}</p>
      <br /><br /><br /><i style="font-size: 80%; opacity: 0.5;">Sent from ${data.siteName} contact form</i>
    </div>
  `;
} 