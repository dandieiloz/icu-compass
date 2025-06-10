import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper function to delete all documents in a subcollection
async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve(true);
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid hitting stack limits
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}


// Cloud Function to discharge a patient
export const dischargePatient = functions.https.onCall(async (request) => {
    const bedId = request.data.bedId;

    if (!bedId || typeof bedId !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "bedId" argument.');
    }

    const patientPath = `patients/${bedId}`;
    
    try {
        // Define all subcollections to be deleted
        const subcollections = ['tasks', 'medications', 'followups'];

        for (const subcollection of subcollections) {
            await deleteCollection(`${patientPath}/${subcollection}`, 50);
        }
        
        // After all subcollections are empty, delete the main patient document
        await db.doc(patientPath).delete();
        
        return { success: true, message: `Patient in bed ${bedId} was discharged successfully.` };
    } catch (error) {
        console.error(`Error discharging patient ${bedId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to discharge patient.');
    }
});