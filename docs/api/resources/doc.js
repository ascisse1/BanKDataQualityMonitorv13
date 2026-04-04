// JavaScript Document
    (function(){
    var olddiv="";
    $(".selectable").click(function(){
        var id =$(this).attr("id");
        if (olddiv !== ""){
        $("#"+olddiv).hide();
        }
        olddiv = "d"+id.slice(1);
        $("#"+olddiv).show();
    }); 
    })();
  
    function get_ul_child(elem){
      var children = elem.children;
      for (i = 0; i<children.length; i++){
        if (children[i].tagName === "UL"){
          return children[i];
        }      
      }
  
    }
    
    function expand_or_collapse(node){
      var child = get_ul_child(node.parentElement);
      if (node.className.search("fa-caret-down") !=-1){
      node.className = node.className.replace("fa-caret-down","fa-caret-right");
      child.style.display = "none";
      } 
      else{
      node.className = node.className.replace("fa-caret-right","fa-caret-down");
      child.style.display = "block";
      }          
    
    }
