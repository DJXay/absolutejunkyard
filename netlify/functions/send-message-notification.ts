export const handler = async (event: any) => {
  try {
    const { message, email } = JSON.parse(event.body);
    // Add your email logic here
    console.log(`Sending message to ${email}: ${message}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success' }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};