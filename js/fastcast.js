/**
 * @file FastCast
 */

/**
 * @module FastCast
 */
var FastCast = (function(){

    var clientCallbacks = {},
        TAG = "FastCast",
        chunkMessage = null;

    /**
     * Returns handler registered to the event.
     * @func setCallback
     * @memberof module:FastCast
     * @private
     * @param {string} event - event name
     * @returns {function}
     */
    function setCallback(event) {
        return function(callback) {
            clientCallbacks[event] = callback;
        }
    }

    /**
     * Client connect from castReceiverContext.
     * @func onSenderConnected
     * @memberof module:FastCast
     * @private
     * @param {Object} event - client data
     * @returns {undefined}
     */
    function onSenderConnected(event) {
        if (!clientCallbacks["connect"]) return;
        clientCallbacks["connect"](event);
    }

    /**
     * Client disconnect from castReceiverContext.
     * @func onSenderDisconnected
     * @memberof module:FastCast
     * @private
     * @param {Object} event - client data
     * @returns {undefined}
     */
    function onSenderDisconnected(event) {
        if (!clientCallbacks["disconnect"]) return;
        clientCallbacks["disconnect"](event);
    }

    function connect() {
        // handler for 'senderconnected' event
        window.castReceiverContext.onSenderConnected = onSenderConnected;
        // handler for 'senderdisconnected' event
        window.castReceiverContext.onSenderDisconnected = onSenderDisconnected;
    }

    function sendTheMessage(data) {
        context.sendCustomMessage("urn:x-cast:com.verizon.smartview", undefined, data);
    }
    /**
     * Initializes FastCast. Expects 2 arguments: namespace
     * and a callback function. Namespace name is required.
     * Callback function is optional. If provided, does not receive any arguments.
     * @method init
     * @memberof module:FastCast
     * @access private
     * @param {string} namespace - namespace to create CastMessageBus to handle messages
     * @param {function} [callback] - function to be called after initialization
     * @returns {undefined}
     */
     const context = cast.framework.CastReceiverContext.getInstance();
     const CUSTOM_CHANNEL = "urn:x-cast:com.verizon.smartview";
     function getTheContext() {
        return context;
    }
    function init(namespace, callback) {
        console.log(Constants.APP_INFO, TAG, 'Starting Receiver Manager');
        const playerManager = context.getPlayerManager();
        const options = new cast.framework.CastReceiverOptions();
        options.maxInactivity = 3600;

        const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
        const LOG_TAG = 'MeraChrome';

        context.addCustomMessageListener(CUSTOM_CHANNEL, function(customEvent) {
            // handle customEvent.
            console.log("addCustomMessageListener: " + customEvent);
            console.log("addCustomMessageListener: " + JSON.stringify(customEvent));
      
            var parsed = customEvent.data;
            var event = parsed.event;
            var type = parsed.media && parsed.media.type;
        
            if (parsed.media) tvApp.stateObj = parsed;

            switch(event) {
                case 'LOAD_START':
                    tvApp.stateObj.loadStarted = false;
                    console.log(Constants.APP_INFO, TAG, type);
        
                    type = type && typeof type == 'string' && type.toLowerCase();
                    Utils.triggerEvent("load_start_"+type, parsed);
                    break;
                case 'RESUME':
                case 'PAUSE':
                case 'START_SLIDESHOW':
                case 'ADD_SLIDESHOW':
                case 'STOP_SLIDESHOW':
                case 'STOP_MEDIA':
                case 'NEXT_SLIDE':
                case 'PREVIOUS_SLIDE':
                    event = event.toLowerCase();
                    Utils.triggerEvent(event, parsed);
                    break;
                case 'CHUNK_MESSAGE':
                    chunkMessage = null;
                    try {
                        chunkMessage = new ChunkMessage(parsed.id, parsed.chunk_count);
                        console.log(Constants.APP_INFO, TAG, 'Chunk message obj', chunkMessage);
                    } catch(e) {
                        console.log(Constants.APP_INFO, TAG, 'Chunk message obj creation error', e);
                    }
                    break;
                case 'CHUNK_PART':
                    if (!chunkMessage) break;
                    try {
                        chunkMessage.addChunk(parsed.id, parsed.chunk_index, parsed.message);
                        console.log(Constants.APP_INFO, TAG, 'Chunk message "'+ parsed.chunk_index +'" is added');
                        if (chunkMessage.received) {
                            var message = JSON.parse(chunkMessage.message);
                            event = message.event && message.event.toLowerCase();
                            console.log(Constants.APP_INFO, TAG, 'Chunk message received');
                            Utils.triggerEvent(event, message);
                        }
                    } catch(e) {
                        console.log(Constants.APP_INFO, TAG, 'Chunk part error', e);
                    }
                    break;
                }
            });
            
        const playbackConfig = new cast.framework.PlaybackConfig();
        playbackConfig.autoResumeDuration = 5;
        const namespaces = {'urn:x-cast:com.verizon.smartview' : 'JSON',
                            'urn:x-cast:verizon-cloud' : 'JSON' };
        context.start({ playbackConfig: playbackConfig,
                        customNamespaces:  namespaces});        
        window.castReceiverContext = context;
        console.log(Constants.APP_INFO, TAG, 'Receiver Manager started');

        callback && callback();
    }

    return {
        /**
         * Initializes FastCast. Register messages.
         * @access public
         * @param {string} namespace - namespace to create CastMessageBus to handle messages
         * @param {function} [callback] - function to be called after initialization
         * @returns {undefined}
         */
        init: init,
        /**
         * Registers sender connect event handler.
         * @method onSenderConnected
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * //show sender data when it connects
         * FastCast.onSenderConnected(function (event) {
         *     console.log("Received Sender Connected event: " + event.data);
         * });
         */
        onSenderConnected: setCallback('connect'),

        /**
         * Registers sender disconnect event handler.
         * @method onSenderDisconnected
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * //show sender data when it connects
         * FastCast.onSenderDisconnected(function (event) {
         *     console.log("Received Sender Connected event: " + event.data);
         * });
         */
        onSenderDisconnected: setCallback('disconnect'),

        sendTheMessage: sendTheMessage,
        getTheContext: getTheContext,

        /**
         * Register sender connect/disconnect events
         * @func connect
         * @memberof module:FastCast
         * @access public
         * @returns {undefined}
         * @example
         * FastCast.connect();
         */
        connect: connect
    }
}());

if (typeof module !== "undefined" && module.exports) {
    module.exports.FastCast = FastCast;
}
