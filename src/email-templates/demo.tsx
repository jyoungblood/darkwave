
export function render(data: any) {
  return `
    <center>
      <h1>TEST EMAIL FROM TEST.TSX</h1>
      <p>From: ${data.name} ${data.surname}</p>
      <p>Email: ${data.email}</p>
      <p>Tel: ${data.tel}</p>
      ${data.message ? `<p>Message: ${data.message.replace(/\n/g, '<br />')}</p>` : ''}
    </center>
  `;
} 