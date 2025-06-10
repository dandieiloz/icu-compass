import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();
const firestore = admin.firestore();

interface RequestData {
  patientId: string;
  followUpId: string;
}

const genAI = new GoogleGenerativeAI(functions.config().gemini.key);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const generateSummary = functions.https.onCall(async (request) => {
  const { patientId, followUpId } = request.data as RequestData;

  if (!patientId || !followUpId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'patientId' and 'followUpId' arguments."
    );
  }

  try {
    const followUpRef = firestore
      .collection("patients")
      .doc(patientId)
      .collection("followups")
      .doc(followUpId);
      
    const docSnap = await followUpRef.get();

    if (!docSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Follow-up document not found.");
    }

    const followUpData = docSnap.data();

    const prompt = `
        Summarize the following ICU daily follow-up notes into a concise clinical summary paragraph.
        Focus on the key changes and active issues. Do not just list the values.

        Data:
        ${JSON.stringify(followUpData, null, 2)}
      `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    await followUpRef.update({ aiSummary: summary });

    return { summary: summary };
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate AI summary.");
  }
});