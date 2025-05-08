import type { APIRoute } from 'astro'
import { sendEmail } from '@/lib/dw-email'

export const GET: APIRoute = async ({ request }) => {
  // const url = new URL(request.url);
  // const params = url.searchParams;










// WORKING ✅

  const result = await sendEmail({
    to: 'jonathan.youngblood@gmail.com',
    from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
    subject: 'DEMO EMAIL',
    message: {
      template: '@/email-templates/demo', // ideal path, .tsx optional
      // template: '@/email-templates/demo.tsx',
      // template: 'src/email-templates/demo.tsx',
      // template: './src/email-templates/demo.tsx',
      // template: '../../src/email-templates/demo.tsx',
      data: {
        name: 'JY',
        surname: 'HX',
        email: 'jy@hxgf.io',
        tel: '1234567890'
      }
    },
  });







// mjml version

  // const result = await sendEmail({
  //   to: 'jonathan.youngblood@gmail.com',
  //   from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
  //   subject: 'DEMO EMAIL',
  //   message: {
  //     template: 'demo.mjml.tsx',
  //     // text: 'nice shot (should be the only text)', // optional
  //     mjml: true,
  //     data: {
  //       name: 'JY',
  //       surname: 'HX',
  //       email: 'jy@hxgf.io',
  //       tel: '1234567890',
  //       message: 'nice shot'
  //     }
  //   },
  // });





  // const result = await sendEmail({
  //   to: 'jonathan.youngblood@gmail.com',
  //   from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
  //   subject: 'DEMO EMAIL',
  //   message: {
  //     text: `nice shot (should be the only text) - from your friends at ${import.meta.env.SITE_TITLE}`,
  //   },
  // });




// html only (no template)


  // const result = await sendEmail({
  //   to: 'jonathan.youngblood@gmail.com',
  //   from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
  //   subject: 'DEMO EMAIL',
  //   message: {
  //     html: `<p>nice shot (should be the <b>only</b> text)</p> <p>from your friends at ${import.meta.env.SITE_TITLE}</p>`,
  //     text: `SEPARATE TEXT FALLBACK - nice shot (should be the only text) from your friends at ${import.meta.env.SITE_TITLE}`,
  //   },
  // });




// multiple recipients

  // const result = await sendEmail({
  //   to: ['jonathan.youngblood@gmail.com', 'icarus@dvst.cc', 'jy@hxgf.io'],
  //   from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
  //   subject: 'DEMO EMAIL',
  //   message: {
  //     html: `<p>nice shot (should be the <b>only</b> text)</p> <p>from your friends at ${import.meta.env.SITE_TITLE}</p>`,
  //   },
  // });



// cc & bcc & replyto

  // const result = await sendEmail({
  //   to: 'jonathan.youngblood@gmail.com',
  //   cc: ['icarus@dvst.cc', 'jy@hxgf.io'],
  //   bcc: 'jonathan@oceandev.com',
  //   from: `${import.meta.env.SITE_TITLE} <${import.meta.env.SMTP_USER}>`,
  //   replyTo: 'equipost@hxgf.io',
  //   subject: 'DIFFERENT ANOTHER DEMO EMAIL - demo CC & BCC & replyto',
  //   message: {
  //     html: `<h1>👯‍♂️ HEY MAN 🤗</h1><p>nice shot</p> <p>from your friends at ${import.meta.env.SITE_TITLE}</p>`,
  //   },
  // });




  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}



