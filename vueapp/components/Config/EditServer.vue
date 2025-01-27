<template>
    <div>
        <StudipDialog
            :title="$gettext('Opencast Server Einstellungen')"
            :confirmText="$gettext('Speichern')"
            :closeText="$gettext('Schließen')"
            :disabled="disabled"
            height="600"
            width="600"
            @confirm="storeConfig"
            @close="close"
        >
            <template v-slot:dialogContent ref="editServer-dialog">
                <form class="default" v-if="currentConfig">
                    <fieldset>
                        <legend>
                            {{ $gettext('Grundeinstellungen') }}
                        </legend>
                        <label v-if="config?.service_version">
                            <b> {{ $gettext('Opencast Version') }} </b><br />
                            {{ config.service_version }}
                        </label>

                        <ConfigOption v-for="setting in settings"
                            :setting="setting" :key="setting.name"
                            @updateValue="updateValue" />
                    </fieldset>

                    <WorkflowOptions v-if="id != 'new'"/>
                </form>

                <MessageList :float="true"/>
                <Error :float="true"/>
            </template>

            <template v-slot:dialogButtons>
                <button v-if="config !== null"
                    class="button trash"
                    type="button"
                    @click="deleteConfig"
                    :disabled="disabled"
                >
                    Löschen
                </button>
            </template>
        </StudipDialog>
    </div>
</template>

<script>
import { mapGetters } from "vuex";

import StudipDialog from '@studip/StudipDialog'
import StudipButton from "@studip/StudipButton";
import StudipIcon from "@studip/StudipIcon";
import MessageList from "@/components/MessageList";
import Error from "@/components/Error";
import ConfigOption from "@/components/Config/ConfigOption";
import WorkflowOptions from "@/components/Config/WorkflowOptions";

import axios from "@/common/axios.service";

export default {
    name: "EditServer",

    components: {
        StudipButton,
        StudipIcon,
        StudipDialog,
        ConfigOption,
        MessageList,
        Error,
        WorkflowOptions
    },

    props: {
        id : {
            default: 'new'
        },
        config : {
            type: Object,
            default: null
        }
    },

    data() {
        return {
            currentConfig: {},
            disabled: false
        }
    },

    computed: {
        ...mapGetters({
            configStore: 'config',
            simple_config_list: 'simple_config_list'
        }),

        settings() {
            return [
                {
                    description: this.$gettext('Basis URL zur Opencast Installation'),
                    name: 'service_url',
                    value: this.currentConfig.service_url,
                    type: 'string',
                    placeholder: 'https://opencast.url',
                    required: true
                },
                {
                    description: this.$gettext('Nutzerkennung'),
                    name: 'service_user',
                    value: this.currentConfig.service_user,
                    type: 'string',
                    placeholder: 'ENDPOINT_USER',
                    required: true
                },
                {
                    description: this.$gettext('Passwort'),
                    name: 'service_password',
                    value: this.currentConfig.service_password,
                    type: 'password',
                    placeholder: 'ENDPOINT_USER_PASSWORD',
                    required: true
                },
                {
                    description: this.$gettext('LTI Consumerkey'),
                    name: 'lti_consumerkey',
                    value: this.currentConfig.lti_consumerkey,
                    type: 'string',
                    placeholder: 'CONSUMERKEY',
                    required: true
                },
                {
                    description: this.$gettext('LTI Consumersecret'),
                    name: 'lti_consumersecret',
                    value: this.currentConfig.lti_consumersecret,
                    type: 'password',
                    placeholder: 'CONSUMERSECRET',
                    required: true
                },
                {
                    description: this.$gettext('Zeitpuffer (in Sekunden) um Überlappungen zu verhindern'),
                    name: 'time_buffer_overlap',
                    value: this.currentConfig.time_buffer_overlap ? this.currentConfig.time_buffer_overlap : this.default_time_buffer_overlap,
                    type: 'number',
                    required: false
                },
                {
                    description: this.$gettext('Debugmodus einschalten?'),
                    name: 'debug',
                    value: this.currentConfig.debug,
                    type: 'boolean',
                    required: false
                }
            ];
        },

        default_time_buffer_overlap() {
            return this.configStore.settings.time_buffer_overlap;
        }
    },

    methods: {
        close() {
            this.$emit('close');
        },

        storeConfig() {
            this.disabled = true;
            this.$store.dispatch('clearMessages');

            this.currentConfig.checked = false;

            if (this.id == 'new') {
                this.$store.dispatch('configCreate', this.currentConfig)
                .then(({ data }) => {
                    this.disabled = false;
                    this.$store.dispatch('configListRead', data.config);
                    this.checkConfigResponse(data);
                });
            } else {
                if (this.simple_config_list?.workflow_configs) {
                    this.currentConfig.workflow_configs = this.simple_config_list.workflow_configs;
                }
                this.$store.dispatch('configUpdate', this.currentConfig)
                .then(({ data }) => {
                    this.$store.dispatch('configListRead', data.config);
                    this.disabled = false;
                    this.checkConfigResponse(data);
                });
            }
        },

        deleteConfig() {
            if (confirm(this.$gettext('Sind Sie sicher, dass Sie die Serverkonfiguration löschen möchten? Die damit verbundenen Videos werden danach nicht mehr in Stud.IP zur Verfügung stehen!'))) {
                if (this.id == 'new') {
                    this.currentConfig = {}
                } else {
                    this.$store.dispatch('configDelete', this.id)
                        .then(() => {
                            this.$store.dispatch('configListRead');
                            this.$store.dispatch('addMessage', {
                                'type': 'success',
                                'text': this.$gettext('Serverkonfiguration wurde entfernt')
                            });
                            this.$forceUpdate;
                        });
                }

                this.close();
            }
        },

        checkConfigResponse(data) {
            if (data.lti !== undefined) {
                this.checkLti(data.lti);
            }
            if (data.message !== undefined) {
                this.$store.dispatch('addMessage', {
                     type: data.message.type,
                     text: data.message.text
                });

                if(data.message.type == 'success'){
                    this.$emit('close');
                }
            }
        },

        async checkLti(data)
        {
            let view = this;

            await this.$store.dispatch('authenticateLti');

            // make an lti call to make sure it worked, there are some caveats though...
            // - already succesful calls will not be revoked
            // - unsuccesful calls will persist even if it worked now
            axios({
                url: data[0].launch_url,
                method: "GET",
                withCredentials: true,
            }).then(({ data }) => {
                if (data.user_id == undefined) {
                    view.postLtiCheckFailedMessage();
                } else {
                    view.postLtiCheckSucceededMessage();
                }
            }).catch(function (error) {
                view.postLtiCheckFailedMessage();
            });
        },

        postLtiCheckFailedMessage()
        {
            this.$store.dispatch('addMessage', {
                type: 'error',
                text: this.$gettext('Überprüfung der LTI Verbindung fehlgeschlagen! '
                    + 'Kontrollieren Sie die eingetragenen Daten und stellen Sie sicher, '
                    + 'dass Cross-Origin Aufrufe von dieser Domain aus möglich sind! '
                    + 'Denken sie auch daran, in Opencast die korrekten access-control-allow-* '
                    + 'Header zu setzen.'
                )
            });
        },

        postLtiCheckSucceededMessage()
        {
            this.$store.dispatch('addMessage', {
                type: 'success',
                text: this.$gettext('Die LTI-Konfiguration wurde erfolgreich überprüft!')
            });
        },

        updateValue(setting, newValue) {
            this.currentConfig[setting.name] = newValue;
        },
    },

    mounted() {
        this.$store.dispatch('clearMessages');

        if (this.id !== 'new') {
            if (!this.config) {
                this.$store.dispatch('configRead', this.id)
                .then(() => {
                    this.currentConfig = this.configStore;
                });
            } else {
                this.currentConfig = this.config;
            }
        }

    }
};
</script>
