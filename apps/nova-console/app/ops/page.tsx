import { writeFileSync, mkdirSync } from 'fs'
const VELORA = 'http://localhost:8780/ingest'

export default function Tools(){
  async function sendEvent(formData: FormData){ 'use server';
    await fetch(VELORA,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:formData.get('name')})})
  }
  async function createJob(formData: FormData){ 'use server';
    const job={creator_id:formData.get('creator_id'),post_id:formData.get('post_id')}
    const dir='artifacts/jobs/media'; mkdirSync(dir,{recursive:true});
    writeFileSync(`${dir}/${Date.now()}.json`,JSON.stringify(job))
  }
  return (
    <div>
      <form action={sendEvent} className="flex gap-2">
        <input name="name" placeholder="event"/>
        <button type="submit">send event</button>
      </form>
      <form action={createJob} className="flex gap-2 mt-4">
        <input name="creator_id" placeholder="creator"/>
        <input name="post_id" placeholder="post"/>
        <button type="submit">create job</button>
      </form>
    </div>
  )
}
