(function(window, document, $) {
    'use strict';

    $(document).ready(function(e) {
        var scrobble_form = document.getElementById('form-manual-scrobble');

        if (scrobble_form) {
            var post_url = $(scrobble_form).attr('action');

            $('button.btn-scrobble', scrobble_form).on('click', function(ev) {
                var $fieldsets = $('fieldset', scrobble_form);
                var list_of_tracks = {
                    'format': 'json',
                    'artist' : [],
                    'track': [],
                    'album': [],
                    'timestamp': []
                };
                var do_scrobble = true;

                ev.preventDefault();

                $fieldsets.each(function() {
                    var track_info = checkFieldData(this);

                    if (track_info) {
                        list_of_tracks.artist.push(track_info.artist);
                        list_of_tracks.track.push(track_info.track);
                        list_of_tracks.album.push(track_info.album);
                        list_of_tracks.timestamp.push(track_info.timestamp);
                    } else {
                        do_scrobble = false;
                    }
                });

                if (do_scrobble) {
                    $(this).text('Scrobbling...').prop('disabled', true);

                    scrobble(list_of_tracks, function(){
                        // ToDo: optimize
                        $('button.btn-scrobble').text('Scrobble!').prop('disabled', false);
                    });                    
                }
            });

            // Focus the first field so users can get scrobbling fast
            $('input.form-control').first().focus();
        }

        var login_button = document.getElementById('btn-login');        
        if (login_button && typeof(ga) !== 'undefined') {
            $(login_button).on('click', function(ev) {
                var dest_url = ev.target.href;
                
                ev.preventDefault();

                ga('send', 'event', 'btn-login', 'click', 'login', {
                    'hitCallback': function() {
                        document.location = dest_url;
                    }
                });
            });
        }

        function checkFieldData(fieldset) {
            var artist = $(".artist", fieldset).val();
            var track  = $(".track", fieldset).val();
            var album  = $(".album", fieldset).val();
            var timestamp  = $(".timestamp", fieldset).val();

            if (artist.trim() !== '' && track.trim() !== '') {
                return {
                    'artist': artist,
                    'track' : track,
                    'album' : album,
                    'timestamp' : timestamp
                };
            } else {
                $(fieldset).addClass('has-error').attr('aria-invalid', 'true');
                return false;
            }
        }

        function scrobble(list_of_tracks, callback) {
            $.ajax(post_url, {
                type: 'POST',
                data: list_of_tracks
            }).done(function(response) {
                // ToDo: check the response is JSON
                if (response['@attributes'].status == 'ok') {
                    // Send event
                    if (typeof(ga) !== 'undefined') {
                        ga('send', 'event', 'btn-scrobble', 'scrobble', 'manual scrobble', 1);
                    }

                    // Enable scrobbled tracks list
                    var $scrobbled_tracks_list = $('#scrobbled-tracks ul');
                    $('#scrobbling-form').removeClass('col-sm-push-3');
                    $('#scrobbled-tracks').removeClass('hidden');

                    // Here is the scrobbled track info
                    var track = response.scrobbles.scrobble;

                    // Build the list item
                    var item = '<li>';
                    if (track.ignoredMessage['@attributes'].code == '0') {
                        item += '<span class="glyphicon glyphicon-ok"></span>';
                    } else {
                        item += '<span class="glyphicon glyphicon-remove"></span>';
                    }
                    item += ' ' + track.artist + ' - ' + track.track;
                    item += '</li>';

                    // Clear the form if it went ok
                    if (response['@attributes'].status == 'ok') {
                        $('input.form-control').val('').first().focus();
                    }

                    // And add it to the list
                    $scrobbled_tracks_list.append(item);

                }

                callback && callback();
            });
        }
    });

})(window, document, jQuery);
