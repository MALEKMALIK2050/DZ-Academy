import formidable, { IncomingForm } from "formidable";
import { NextApiRequest } from "next";

export const parseForm = async (req: NextApiRequest) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};
