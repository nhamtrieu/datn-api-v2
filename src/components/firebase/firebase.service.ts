import { Injectable } from "@nestjs/common";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseService {
  constructor() {
    const serviceAccount: admin.ServiceAccount = {
      projectId: "datn-7d31c",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDlGW8bPyz6G1J6\n16fehBprTVfLZTZEiQcQ/PM+2Msp4+GTAfWoV0Yo+6P1pLma8lqTZyLCEOxRn42y\n6ID4KMrwJi5OvnDdBgU31DMIB5KEmB8eYCtfrWs21Xxbqi2F86Ih/XbF5Duo24I0\nBIbuBktU40hXbvK9AUEGAXtVnxha07DJrAtPkMjHuND85Ph9BVQyTvfh0xVNvdE2\n1avZ7Tt6EBaeRuUYJzmg1dyA9y9EjK48t6nOqFucM7ddleamrmKAZ+Xaf1r4REQ/\nlJfE/Wr/sVDtznnkYVqr4+XKlBOeKuQDi1FEDZPTkDF7x4PMyh33KIQypcRKP08Y\nPKXE4GeXAgMBAAECggEAGzQn805PIuu3oYqWDmAVWwR2FlrQVNcIlcXThHTtuu2q\nTXCAIRsr45Xt5C9JMtLwWmx2viCQTyjpBIODPPRrFJUUDpmigTxDxltWK+/qQABo\nQY0d2WCYSIyVFbVhbnR9nheg0OLHCsf18ANRmlX4//11C5zLChJqDDKE2Kfplm8v\nCtqQVSql9uOg/NrLqMaCgyLnVFHMkhhHEhXqLpLien2SFUee+6rXHtg/NhnLv4Fj\n2GpvjNMeuRqNbcqtxCPDZa6I+deBAtDVODnSaiCqDUdrDhJpPiAWM2Ie+Xbr0OSc\nmaSLdPWEOK1V9f4Tshlf9REr7cJ/NNgoK2vaBtI+gQKBgQD+nLMDGOGlWmB+3FDt\nBnb9eZrQE36QnGQPHc4P1a9BtmKAJCVNk+tnP7hjguY5Wlm4OV5ult9a8XG8NEB2\n6LI6m1th6WvC80QyrazuaQjfgwrKC7L82pUbrQAg/i4Ialp5+KujKSitWEEHAOLH\nNuGicUzyf8Yk2drkR2FM+LNQNwKBgQDmWSH7ZJNFU17FxnL/9qYt4DLbci7bBDjB\n9Eju1W2kDox5ob+NRrkhmrRmS7wG6ZHKM5DC+RACCpNysh0RCg6X052y1vDkl4at\n/ZLVYFPwSI9bWFrNv5sFtSAWyjsazSnHELEQBWnlByI1W6QBumNQ3+QW5gvenzEh\nmi6opeAzoQKBgQCdxzUXYj/SW+MYOibb+vmZsdXBw5LWwlMvGuUq4twr+H2psrx7\nCoMCBHabE+7e86JNix99oHjgvmYgnrCj/ycTMlq6ng9tS5qjXQSg6O3atDXnZsCP\n+FQWRmqiB2E3TdCrbPHPth3C7cG+OUpO8S95noR0ccGz7Fy8wY8GR8e2mQKBgQCQ\niALDezLQv+PqUn9bzcYtaMxgVv/BWp/GSuHsQax+0MYhl3TaTzLgO/LPcNu0tp9M\ncRh2zdHWhg5IXCvSwi2v5A7B5Q3XUKAn0cBs8/kW/mA8325yRLQfW6ubwR5ezbZV\n+kovFEaCdvxm4G5Cy1F/sEusdoGiGN66B8UY+qN3oQKBgQDcgAbhq9/76jgfdPH4\nOwq5a7CWwJl+3YKxhjbeOUvxOH7tCgt6oLeE6qPB1grKDxFQbi0O31qxS6g03sNK\nfZiv/jUnB94tUitCNZHQdF3Iu0pyfJPxrL1Hay4/ZD9LBbOQHHE3voALeDARZdgO\naqkF9l91J9B0q5laLz3zbymIDw==\n-----END PRIVATE KEY-----\n",
      clientEmail: "firebase-adminsdk-wz247@datn-7d31c.iam.gserviceaccount.com",
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  getDatabase() {
    return admin.database();
  }

  async sendNotification(
    token: string,
    payload: admin.messaging.MessagingPayload,
  ) {
    try {
      const res = await admin.messaging().send({
        token,
        notification: {
          title: payload.notification.title,
          body: payload.notification.body,
        },
        data: payload.data,
      });
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  async setData(path: string, data: any): Promise<any> {
    const ref = admin.database().ref(path);
    await ref.set(data);
    const snapshot = await ref.once("value");
    return snapshot.val();
  }

  async getData(path: string): Promise<any> {
    const ref = admin.database().ref(path);
    const snapshot = await ref.once("value");
    return snapshot.val();
  }

  async getDataByPath<T>(path: string): Promise<T[]> {
    const snapshot = await admin.database().ref(path).once("value");
    const data = snapshot.val() || {};

    // Chuyển đổi đối tượng thành mảng
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<any> {
    const db = this.getDatabase();
    const snapshot = await db
      .ref("users")
      .orderByChild("phoneNumber")
      .equalTo(phoneNumber)
      .once("value");
    const users = snapshot.val();
    if (users) {
      const userId = Object.keys(users)[0];
      return { id: userId, ...users[userId] };
    } else {
      return null;
    }
  }

  async getDriverByPhoneNumber(phoneNumber: string): Promise<any> {
    const db = this.getDatabase();
    const snapshot = await db
      .ref("drivers")
      .orderByChild("phoneNumber")
      .equalTo(phoneNumber)
      .once("value");
    const drivers = snapshot.val();
    if (drivers) {
      const driverId = Object.keys(drivers)[0];
      return { id: driverId, ...drivers[driverId] };
    } else {
      return null;
    }
  }

  async deleteData(path: string): Promise<void> {
    const ref = admin.database().ref(path);
    await ref.remove();
  }
}
