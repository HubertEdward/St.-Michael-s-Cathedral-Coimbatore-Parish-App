/**
 * People sign in with their phone number and a PIN, and no SMS is sent. Supabase Auth keeps the PIN as the
 * password of a login named after the number. Must match private.my_phone_key in the database and the pin
 * function (supabase/functions/pin).
 */
export const loginEmail = (phone: string) => `${phone.replace(/\D/g, '').slice(-10)}@phone.parish-app.in`;
