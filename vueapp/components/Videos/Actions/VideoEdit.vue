<template>
    <div>
        <StudipDialog
            :title="$gettext('Video bearbeiten')"
            :closeText="$gettext('Abbrechen')"
            :confirmText="$gettext('Speichern')"
            confirmClass="accept"
            :closeClass="'cancel'"
            height="600"
            width="600"
            @close="decline"
            @confirm="accept"
        >
            <template v-slot:dialogContent>
                <form class="default" style="max-width: 50em;" @submit="editVideo">
                    <fieldset>
                        <label>
                            <span class="required" v-translate>
                                Titel
                            </span>

                            <input type="text" maxlength="255"
                                name="title" v-model="event.title" required>
                        </label>

                        <label>
                            <span v-translate>
                                Mitwirkende
                            </span>
                            <input type="text" maxlength="255" name="contributor" v-model="event.contributors">
                        </label>

                        <label>
                            <span v-translate>
                                Thema
                            </span>
                            <input type="text" maxlength="255" name="subject" v-model="event.subject">
                        </label>

                        <label>
                            <span v-translate>
                                Beschreibung
                            </span>
                            <textarea cols="50" rows="5" name="description" v-model="event.description"></textarea>
                        </label>

                        <label>
                            Schlagworte
                            <TagBar :taggable="event" @update="updatedTags"/>
                        </label>

                        <label v-if="isCourse">
                            <div>
                                <span v-translate>
                                    Sichtbarkeit des Videos
                                </span>
                            </div>

                            <section class="hgroup size-m">
                                <label>
                                    <input type="radio" value="2"
                                        :checked="visibility == 'default'"
                                        @change="changeVisibility('default')"
                                    >
                                    <translate>
                                        Standard
                                    </translate>
                                </label>

                                <label>
                                    <input type="radio" value="1"
                                        :checked="visibility == 'visible'"
                                        @change="changeVisibility('visible')"
                                    >
                                    <translate>
                                        Sichtbar
                                    </translate>
                                </label>

                                <label>
                                    <input type="radio" value="0"
                                        :checked="visibility == 'hidden'"
                                        @change="changeVisibility('hidden')"
                                    >
                                    <translate>
                                        Unsichtbar
                                    </translate>
                                </label>
                            </section>
                        </label>

                        <label v-if="isCourse">
                            <span v-translate>
                                Zeitstempel für die Sichtbarkeit
                            </span>
                            <div class="oc--timestamp-input">
                                <input class="oc--datetime-input" type="datetime-local" name="visibilityDate" id="visibilityDate" v-model="visible_timestamp" @change="checkVisibility">
                                <button class="oc--trash-button" type="button" @click="visible_timestamp=null">
                                    <studip-icon shape="trash" role="clickable"/>
                                </button>
                            </div>
                        </label>
                    </fieldset>
                </form>
            </template>
        </StudipDialog>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import StudipDialog from '@studip/StudipDialog';
import StudipIcon from '@/components/Studip/StudipIcon'
import TagBar from '@/components/TagBar.vue';

export default {
    name: "VideoEdit",

    components: {
        StudipDialog, TagBar,
        StudipIcon
    },

    data() {
        return {
            visibility: null,
            visible_timestamp: null,
            use_timestamp: false
        }
    },

    props: ['event'],

    emits: ['done', 'cancel'],

    computed: {
        ...mapGetters([
            "cid",
            "playlists",
            "playlist"
        ]),

        isCourse() {
            return this?.cid ? true : false;
        },

        defaultVisibility() {
            return this.playlist['visibility'];
        },
    },

    methods: {
        async accept() {
            // Handle visibility
            this.event.cid = this.cid;
            this.event.playlist_token = this.playlist?.token;
            this.checkVisibility();
            if (this.visibility === "default") {
                this.event.seminar_visibility = null;
            }
            else {
                this.event.seminar_visibility = {
                    'visibility': this.visibility,
                    'visible_timestamp': this.visible_timestamp
                };
            }

            await this.$store.dispatch('updateVideo', this.event)
            .then(({ data }) => {
                this.$store.dispatch('addMessage', data.message);
                let emit_action = data.message.type == 'success' ? 'refresh' : '';
                this.$emit('done', emit_action);
            }).catch(() => {
                this.$emit('cancel');
            });
        },

        decline() {
            this.$emit('cancel');
        },

        updatedTags() {
            for (let i = 0; i < this.event.tags.length; i++) {
                if (typeof this.event.tags[i] !== 'object') {
                    // fix tag, because vue-select seems to have an incosistent behaviour
                    this.event.tags[i] = {
                        tag:  this.event.tags[i]
                    }
                }
            }
        },

        checkVisibility() {
            if (this.visible_timestamp) {
                if (Date.parse(this.visible_timestamp) < Date.now()) {
                    this.visibility = "visible";
                }
                else {
                    this.visibility = "hidden";
                }
            }
            else if (!this.visibility) {
                this.visibility = "default";
            }
        },

        changeVisibility(visibility) {
            this.visibility = visibility;
            if (this.visible_timestamp) {
                if (visibility === "default" ||
                    visibility === "hidden" && Date.parse(this.visible_timestamp) < Date.now() ||
                    visibility === "visible" && Date.parse(this.visible_timestamp) >= Date.now())
                {
                    this.visible_timestamp = null;
                }
            }
        }
    },

    mounted() {
        // Initialize visibility
        this.visibility = this.event.seminar_visibility?.visibility;
        this.visible_timestamp = this.event.seminar_visibility?.visible_timestamp;
        this.checkVisibility();
    }
}
</script>