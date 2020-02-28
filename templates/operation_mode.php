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
            <?php SelectorOptions("operation_mode", $modes, $selectedMode, "op_mode-select") ?>
          </div>
        </div>
        <div class="row mt-2">
          <div class="form-group col-md-6">
            <div class="alert alert-warning mx-1" role="alert" id="op_mode-description">
            </div>
          </div>
        </div>
        <form action="?page=system_info" method="POST">
            <?php echo CSRFTokenFieldTag() ?>
          <a href="?page=<?php echo $_GET['page'] ?>" class="btn btn-warning"> <?php echo _("Apply"); ?></a>
        </form>
      </div><!-- /.card-body -->
      <div class="card-footer"></div>
    </div><!-- /.card -->
  </div><!-- /.col-lg-12 -->
</div><!-- /.row -->
