console.log(angular);
angular.module('BlankApp',[],function(){
    console.log(1);
}).run(()=>{
    new Promise((resolve,reject)=>{
        console.log(2);
        resolve(2);
    });
  
});