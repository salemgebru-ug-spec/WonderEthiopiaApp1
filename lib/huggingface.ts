import {InferenceClient} from '@huggingface/inference'

const hf=new InferenceClient(process.env.HUGGING_FACE_API_KEY);

export default hf;