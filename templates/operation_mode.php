<div class="row">
  <div class="col-lg-12">
    <div class="card">
      <div class="card-header">
        <div class="row">
          <div class="col">
            <i class="fas fa-microchip mr-2"></i><?php echo _("Operation mode"); ?>
          </div>
        </div><!-- /.row -->
      </div><!-- /.card-header -->
      <div class="card-body">
        <h4><?php echo _("AP mode"); ?></h4>
        <div class="row mt-3">
          <div class="form-group col-md-6">
            <label for="code"><?php echo _("Behaviour of the access point"); ?></label>
            <?php SelectorOptions("op_mode", $modes, $selectedMode, "op_mode-select") ?>
          </div>
        </div>
        <div class="row mt-2">
          <div class="form-group col-md-6">
            <div class="alert alert-warning" role="alert" id="op_mode-description">
            </div>
          </div>
        </div>
        <div class="row" id="hotspot-options">
          <div class="form-group col-md-6">
            <label for="code"><?php echo _("Hotspot interface"); ?></label>
            <?php SelectorOptions("hotspot", $wireless_ints, $hotspot, "hotspot-select") ?>
          </div>
        </div>
        <div class="row" id="bridge-options" <?php if ($selectedMode != "bridge") echo ("style='display:none'");?>>
          <div class="form-group col-md-6">
            <label for="code"><?php echo _("Bridged interface (it should be connected to the Internet)"); ?></label>
            <?php SelectorOptions("bridge_interface", $interfacesAvailableToBridge, null, "bridge-interface-select") ?>
          </div>
        </div>
        <form action="?page=system_info" method="POST">
            <?php echo CSRFTokenFieldTag() ?>
          <a href="#" class="btn btn-warning mt-2" id="op_mode-apply"><?php echo _("Apply settings") ?></a>
        </form>
      </div><!-- /.card-body -->
      <div class="card-footer"></div>
    </div><!-- /.card -->
  </div><!-- /.col-lg-12 -->
</div><!-- /.row -->
