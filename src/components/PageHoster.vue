<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  render(h) {
    return h(this.el);
  }
})
export default class PageHoster extends Vue {
  @Prop({ default: null }) el : any;
}
</script>