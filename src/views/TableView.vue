<template>
  <div class="main-area table-area overflow-visible">
    <div class="main-container">

    </div>
    <div class="bottom-area">
      <ul class="table-tables">
        <li v-for="(table,key) in tables" :key="key">{{ table }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Inject, Model, Prop, Provide, Vue, Watch } from "vue-property-decorator";
import PlayTable from '../model/PlayTable'
import TableServices from '../services/TableServices'

@Component({
  components: {

  }
})
export default class TableView extends Vue {

  @Prop({default:null}) tableService : TableServices;

  tables : Array<PlayTable> = null;

  mounted() {
    this.tables = this.tableService.getData();

    
  }
}

</script>

<style lang="scss">
@import "../assets/sass/_scroll";

.table-area {

  .main-container {
    padding: 30px;
  }

  .bottom-area {

  }
  
}

.table-tables {
  list-style: none;
  margin: 0;
  padding: 0;
}

</style>


