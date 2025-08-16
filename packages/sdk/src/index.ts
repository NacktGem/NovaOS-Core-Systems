import { request } from 'undici';

export async function get(url: string) {
  const { body } = await request(url);
  return body.text();
}
