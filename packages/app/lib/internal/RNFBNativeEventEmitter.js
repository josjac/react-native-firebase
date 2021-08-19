/*
 * Copyright (c) 2016-present Invertase Limited & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this library except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { NativeEventEmitter, NativeModules } from 'react-native';

const { RNFBAppModule } = NativeModules;

class RNFBNativeEventEmitter extends NativeEventEmitter {
  constructor() {
    super(RNFBAppModule);
    this.ready = false;
  }

  addListener(eventType, listener, context) {
    if (!this.ready) {
      RNFBAppModule.eventsNotifyReady(true);
      this.ready = true;
    }
    RNFBAppModule.eventsAddListener(eventType);

    let subscription = super.addListener(`rnfb_${eventType}`, listener, context);

    // React Native 0.65+ have a re-written EventEmitter that returns an unsubscribe now,
    // vs. our previous expectation of something with shape `{ eventType: 'rnfb_<eventType>`, ...}`
    // for forwards and backwards compatibility, we add that specific key in
    subscription.eventType = `rnfb_${eventType}`;

    // New style is to return a remove function on the object, just in csae people call that,
    // we will modify it to do our native unsubscription then call the original
    let originalRemove = subscription.remove;
    let newRemove = () => {
      RNFBAppModule.eventsRemoveListener(eventType, false);
      if (originalRemove != null) {
        originalRemove();
      }
    };
    subscription.remove = newRemove;
    return subscription;
  }

  removeAllListeners(eventType) {
    RNFBAppModule.eventsRemoveListener(eventType, true);
    super.removeAllListeners(`rnfb_${eventType}`);
  }

  // This is likely no longer ever called, but it is here for backwards compatibility with RN <= 0.64
  removeSubscription(subscription) {
    RNFBAppModule.eventsRemoveListener(subscription.eventType.replace('rnfb_'), false);
    if (super.removeSubscription) {
      super.removeSubscription(subscription);
    }
  }
}

export default new RNFBNativeEventEmitter();
