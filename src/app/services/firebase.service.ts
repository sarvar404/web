import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Unsubscribe,
  doc,
  docData,
  onSnapshot,
  setDoc,
} from '@angular/fire/firestore';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Observable, map, Subject, from, Subscription, catchError, of } from 'rxjs';
import { SubscriptionChangeEnum } from '../model/subscription-change-enum';


const COL_PRODUCTION: string = 'production_user_info';
const COL_SUBSCRIPTION: string = 'subscriptions';
@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  subscriptionChangeSubject: Subject<SubscriptionChangeEnum> =
    new Subject<SubscriptionChangeEnum>();
  private subscription: Subscription | undefined;
  private subscriptionListener: Unsubscribe | undefined;
  private lastDuration: number = 0;
  firestore: Firestore = inject(Firestore);
  deviceId: string = '';
  constructor() {
    const fpPromise = FingerprintJS.load();
    (async () => {
      const fp = await fpPromise;
      const result = await fp.get();
      this.deviceId = result.visitorId;
    })();

    this.getBrowserId().then((browserId) => {
      this.deviceId = browserId;
    });
  }

  addDeviceOption(userName: string) {
    console.log('received response here');
    
    const itemRef = doc(this.firestore, COL_PRODUCTION, userName);

    this.getBrowserId().then((browserId) => {
      this.subscription = from(docData(itemRef)).subscribe((item: any) => {
        item['device_id'] = this.deviceId;

        setDoc(itemRef, item)
          .then(() => {
            this.subscription?.unsubscribe();
          })
          .catch((error) => {
            this.subscription?.unsubscribe();
            console.error('Failed to insert record:', error);
          });
      });
    });
  }

  addDeviceIdToSubscription(userName: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const itemRef = doc(this.firestore, COL_PRODUCTION, userName);
      this.getBrowserId().then((browserId) => {
        const deviceIdSubscription = from(docData(itemRef)).subscribe((item: any) => {

          
          item['device_id'] = this.deviceId;

            setDoc(itemRef, item)
              .then(() => {
                deviceIdSubscription.unsubscribe();
                resolve(true); // Resolve the promise with true indicating success
              })
              .catch((error) => {
                deviceIdSubscription.unsubscribe();
                console.error('Failed to insert record:', error);
                resolve(false); // Resolve the promise with false indicating failure
              });
        });
      });
    });
  }



  removeDeviceIdFromSubscriptionOnLogin(userName: string): Promise<void> {
    const itemRef = doc(this.firestore, COL_PRODUCTION, userName);
  
    return new Promise<void>((resolve, reject) => {
      const subscription = from(docData(itemRef))
        .pipe(
          map((item: any) => {
            item['device_id'] = '';
            return item;
          })
        )
        .subscribe((item: any) => {
          setDoc(itemRef, item)
            .then(() => {
              subscription.unsubscribe();
              resolve();
            })
            .catch((error: any) => {
              subscription.unsubscribe();
              reject(error);
            });
        });
    });
  }
  

  
  registerSubscriptionEvents(
    userName: string
  ): Observable<SubscriptionChangeEnum> {
    const itemCollection = doc(this.firestore, COL_PRODUCTION, userName);
    this.subscriptionListener = onSnapshot(itemCollection, (snapshot) => {
      const item = snapshot.data();
      if (item) {
        console.log('>>>>>>>>>>> Event received   ' + JSON.stringify(item));

        const date: Date = new Date(item['subs_start_date']['seconds'] * 1000);
        console.log(date);
        const futureDate: Date = new Date(
          date.getTime() + item['days'] * 24 * 60 * 60 * 1000
        );
        const now: Date = new Date();
        if (futureDate >= now) {
          console.log('User has an active subscription');
          if (
            typeof item['device_id'] !== 'undefined' &&
            item['device_id'] != '' &&
            item['device_id'] != this.deviceId
          ) {
            console.log('Device ID does not match.');
            this.subscriptionChangeSubject.next(
              SubscriptionChangeEnum.Another_Device
            );
          } else {
            this.subscriptionChangeSubject.next(SubscriptionChangeEnum.Valid);
          }
        } else {
          this.subscriptionChangeSubject.next(SubscriptionChangeEnum.Expired);
        }
      } else {
        this.subscriptionChangeSubject.next(
          SubscriptionChangeEnum.INVALID_USER
        );
      }
    });

    return this.subscriptionChangeSubject.asObservable();
  }
  unsubscribeFromSubscriptionEvents() {
    if (this.subscriptionListener) {
      this.subscriptionListener();
      this.subscriptionListener = undefined;
    }
  }
  getSubscriptionByUserName(userName: string) {
    const itemCollection = doc(this.firestore, COL_PRODUCTION, userName);

    return docData(itemCollection);
  }
  verifyPinForUser(userName: string, enteredPin: string): Observable<boolean> {
    const itemCollection = doc(this.firestore, COL_PRODUCTION, userName);
    return from(docData(itemCollection)).pipe(
      map((data: any) => { 
      
        return data.adults_pin === enteredPin;
      }),
      catchError(() => of(false))
    );
    //return from(docData(itemCollection));
  }
  private async getBrowserId(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }


  updateLastDuration(duration: number) {

    console.log(localStorage.getItem('username') + ''+"received", duration)
    this.lastDuration = duration;

    const itemRef = doc(this.firestore, 'video_duration', localStorage.getItem('username') + '' + '');

    setDoc(itemRef, { duration: this.lastDuration })
      .then(() => {
        console.log('Last duration updated successfully');
      })
      .catch((error) => {
        console.error('Failed to update last duration:', error);
      });
  }

  
}
