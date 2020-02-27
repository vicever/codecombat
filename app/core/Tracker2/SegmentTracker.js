import BaseTracker from './BaseTracker'

// Copied from Segment analytics-js getting started guide at:
// https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/quickstart/
export function loadSegment () {
  /* eslint-disable */

  // Create a queue, but don't obliterate an existing one!
  var analytics = window.analytics = window.analytics || [];

  // If the real analytics.js is already on the page return.
  if (analytics.initialize) return;

  // If the snippet was invoked already show an error.
  if (analytics.invoked) {
    if (window.console && console.error) {
      console.error('Segment snippet included twice.');
    }
    return;
  }

  // Invoked flag, to make sure the snippet
  // is never invoked twice.
  analytics.invoked = true;

  // A list of the methods in Analytics.js to stub.
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on'
  ];

  // Define a factory to create stubs. These are placeholders
  // for methods in Analytics.js so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  analytics.factory = function(method){
    return function(){
      var args = Array.prototype.slice.call(arguments);
      args.unshift(method);
      analytics.push(args);
      return analytics;
    };
  };

  // For each of our methods, generate a queueing stub.
  for (var i = 0; i < analytics.methods.length; i++) {
    var key = analytics.methods[i];
    analytics[key] = analytics.factory(key);
  }

  // Define a method to load Analytics.js from our CDN,
  // and that will be sure to only ever load it once.
  analytics.load = function(key, options){
    // Create an async script element based on your key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://cdn.segment.com/analytics.js/v1/'
      + key + '/analytics.min.js';

    // Insert our script next to the first script element.
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(script, first);
    analytics._loadOptions = options;
  };

  // Add a version to keep track of what's in the wild.
  analytics.SNIPPET_VERSION = '4.1.0';

  // Load Analytics.js with your key, which will automatically
  // load the tools you've enabled for your account. Boosh!
  analytics.load('yJpJZWBw68fEj0aPSv8ffMMgof5kFnU9');

  // Make the first page call to load the integrations. If
  // you'd like to manually name or tag the page, edit or
  // move this call however you'd like.
  //
  // Do not track the first page view, we'll handle this manually
  //
  // analytics.page();
}

export default class SegmentTracker extends BaseTracker {
  constructor (store) {
    super()

    this.store = store
    this.enabled = false
  }

  async _initializeTracker () {
    this.store.watch(
      (state, getters) => getters['me/isTeacher'],
      this.onIsTeacherChanged.bind(this)
    )

    if (this.store.getters['me/isTeacher']) {
      loadSegment()
      window.analytics.ready(this.onInitializeSuccess)
    } else {
      this.onInitializeSuccess()
    }
  }

  async trackPageView (includeIntegrations = {}) {
    await this.initializationComplete

    if (!this.enabled) {
      return
    }

    const url = `/${Backbone.history.getFragment()}`
    window.analytics.page(url, {}, {
      integrations: {
        All: false,
        'Google Analytics': false,
        'Segment.io': false
      }
    })
  }

  async identify (traits = {}) {
    await this.initializationComplete

    if (!this.enabled) {
      return
    }

    super.identify(traits);
  }

  async trackEvent (action, properties = {}, includeIntegrations = {}) {
    await this.initializationComplete

    if (!this.enabled) {
      return
    }

    super.trackEvent(action, properties, includeIntegrations);
  }

  onIsTeacherChanged (isTeacher) {
    if (this.enabled) {
      return
    }

    if (isTeacher) {
      this.enabled = true
      loadSegment()
    }
  }
}
