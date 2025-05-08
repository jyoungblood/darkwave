export function render(data: any) {
  return `
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <p>From: ${data.name} ${data.surname}</p>
              <p>Email: ${data.email}</p>
              <p>Tel: ${data.tel}</p>
              ${data.message ? `<p>Message: ${data.message.replace(/\n/g, '<br />')}</p>` : ''}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;
} 