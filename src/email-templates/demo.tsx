export function render(data: any) {
  return `
    <center>
      <h1>TEST EMAIL FROM DEMO.TSX</h1>
      <p>From: ${data.name}</p>
      <p>Email: ${data.email}</p>
      ${data.message ? `<p>Message: ${data.message.replace(/\n/g, '<br />')}</p>` : ''}
    </center>
  `;
} 