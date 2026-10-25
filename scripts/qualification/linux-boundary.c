#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/landlock.h>
#include <linux/seccomp.h>
#include <sched.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <unistd.h>
#ifndef LANDLOCK_ACCESS_FS_TRUNCATE
#define LANDLOCK_ACCESS_FS_TRUNCATE (1ULL<<14)
#endif
#ifndef LANDLOCK_ACCESS_FS_IOCTL_DEV
#define LANDLOCK_ACCESS_FS_IOCTL_DEV (1ULL<<15)
#endif
static void fail(const char *name){perror(name);exit(126);}
static int add(int rules,const char *file,uint64_t rights){int fd=open(file,O_PATH|O_CLOEXEC);if(fd<0){if(errno==ENOENT)return 0;fail("open policy root");}struct stat s;if(fstat(fd,&s))fail("stat policy root");if(!S_ISDIR(s.st_mode))rights&=~LANDLOCK_ACCESS_FS_READ_DIR;struct landlock_path_beneath_attr a={.allowed_access=rights,.parent_fd=fd};int result=syscall(SYS_landlock_add_rule,rules,LANDLOCK_RULE_PATH_BENEATH,&a,0);close(fd);if(result)fail("landlock_add_rule");return 0;}
#define BLOCK(n) BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K,(n),0,1),BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_ERRNO|EPERM)
int main(int argc,char **argv){
  int separator=0;for(int i=1;i<argc;i++)if(!strcmp(argv[i],"--")){separator=i;break;}if(!separator||separator+1>=argc)return 2;
  int abi=syscall(SYS_landlock_create_ruleset,NULL,0,LANDLOCK_CREATE_RULESET_VERSION);if(abi<3)fail("Landlock ABI >=3 required");
  uint64_t rights=(1ULL<<15)-1;if(abi>=5)rights|=LANDLOCK_ACCESS_FS_IOCTL_DEV;
  struct landlock_ruleset_attr attr={.handled_access_fs=rights};int rules=syscall(SYS_landlock_create_ruleset,&attr,sizeof(attr),0);if(rules<0)fail("landlock_create_ruleset");
  uint64_t read=LANDLOCK_ACCESS_FS_READ_FILE|LANDLOCK_ACCESS_FS_READ_DIR;
  const char *system[]={"/usr/lib","/usr/lib64","/lib","/lib64","/usr/share/locale","/etc/ld.so.cache","/etc/ld.so.preload","/dev/urandom","/dev/random","/sys/devices/system/cpu","/sys/kernel/mm/transparent_hugepage",NULL};
  for(int i=0;system[i];i++)add(rules,system[i],read);
  add(rules,"/lib64/ld-linux-x86-64.so.2",LANDLOCK_ACCESS_FS_EXECUTE|LANDLOCK_ACCESS_FS_READ_FILE);
  add(rules,"/dev/null",LANDLOCK_ACCESS_FS_READ_FILE|LANDLOCK_ACCESS_FS_WRITE_FILE);
  for(int i=1;i<separator;i++)add(rules,argv[i],read);
  add(rules,argv[separator+1],LANDLOCK_ACCESS_FS_EXECUTE|LANDLOCK_ACCESS_FS_READ_FILE);
  if(prctl(PR_SET_NO_NEW_PRIVS,1,0,0,0))fail("no_new_privs");if(syscall(SYS_landlock_restrict_self,rules,0))fail("landlock_restrict_self");close(rules);
  struct sock_filter filter[]={
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS,offsetof(struct seccomp_data,arch)),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K,AUDIT_ARCH_X86_64,1,0),BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_KILL_PROCESS),
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS,offsetof(struct seccomp_data,nr)),
    BPF_JUMP(BPF_JMP|BPF_JGE|BPF_K,0x40000000,0,1),BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_ERRNO|EPERM),
    BLOCK(SYS_socket),BLOCK(SYS_socketpair),BLOCK(SYS_connect),BLOCK(SYS_bind),BLOCK(SYS_listen),BLOCK(SYS_accept),BLOCK(SYS_accept4),
    BLOCK(SYS_fork),BLOCK(SYS_vfork),BLOCK(SYS_ptrace),BLOCK(SYS_process_vm_readv),BLOCK(SYS_process_vm_writev),
    BLOCK(SYS_unshare),BLOCK(SYS_setns),BLOCK(SYS_mount),BLOCK(SYS_open_by_handle_at),BLOCK(SYS_bpf),BLOCK(SYS_keyctl),BLOCK(SYS_add_key),BLOCK(SYS_request_key),BLOCK(SYS_io_uring_setup),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K,SYS_clone3,0,1),BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_ERRNO|ENOSYS),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K,SYS_clone,0,4),
    BPF_STMT(BPF_LD|BPF_W|BPF_ABS,offsetof(struct seccomp_data,args[0])),BPF_STMT(BPF_ALU|BPF_AND|BPF_K,CLONE_THREAD),
    BPF_JUMP(BPF_JMP|BPF_JEQ|BPF_K,0,0,1),BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_ERRNO|EPERM),
    BPF_STMT(BPF_RET|BPF_K,SECCOMP_RET_ALLOW)
  };
  struct sock_fprog program={.len=sizeof(filter)/sizeof(filter[0]),.filter=filter};if(prctl(PR_SET_SECCOMP,SECCOMP_MODE_FILTER,&program))fail("seccomp");
  struct rlimit cpu={120,121},files={256,256},core={0,0};if(setrlimit(RLIMIT_CPU,&cpu)||setrlimit(RLIMIT_NOFILE,&files)||setrlimit(RLIMIT_CORE,&core))fail("resource limits");
  execv(argv[separator+1],&argv[separator+1]);fail("exec reviewed entry");
}
