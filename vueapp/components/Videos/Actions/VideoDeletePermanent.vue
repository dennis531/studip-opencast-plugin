<template>
    <div>
        <StudipDialog v-if="event.state !== 'running'"
            :title="$gettext('Aufzeichnung entfernen')"
            :confirmText="$gettext('Akzeptieren')"
            :confirmClass="'accept'"
            :closeText="$gettext('Abbrechen')"
            :closeClass="'cancel'"
            height="175"
            @close="decline"
            @confirm="removeVideo"
        >
            <template v-slot:dialogContent>
                <translate>Möchten Sie die Aufzeichnung wirklich unwiderruflich entfernen?</translate>
            </template>
        </StudipDialog>

        <StudipDialog v-else
            :title="$gettext('Aufzeichnung entfernen')"
            :closeText="$gettext('Abbrechen')"
            :closeClass="'cancel'"
            height="215"
            @close="decline"
            @confirm="removeVideo"
        >
            <template v-slot:dialogContent>
                <translate>Das Video wird zurzeit verarbeitet und kann deshalb nicht unwiderruflich entfernt werden. Versuchen Sie es zu einem späteren Zeitpunkt erneut.</translate>
            </template>
        </StudipDialog>
    </div>
</template>

<script>
import StudipDialog from '@studip/StudipDialog'

export default {
    name: 'VideoDelete',

    components: {
        StudipDialog
    },

    props: ['event'],

    emits: ['done', 'cancel'],

    methods: {
        async removeVideo() {
            await this.$store.dispatch('deleteVideo', this.event.token)
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
    },
}
</script>