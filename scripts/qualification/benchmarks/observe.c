#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>
// External native wait4 instrument; library startup is excluded by separate API drivers.
int main(int argc,char **argv){if(argc<3)return 2;struct timespec start,end;clock_gettime(CLOCK_MONOTONIC,&start);pid_t pid=fork();if(pid<0)return 126;if(pid==0){execv(argv[2],argv+2);perror("exec measured entry");_exit(126);}int status;struct rusage usage;if(wait4(pid,&status,0,&usage)<0)return 126;clock_gettime(CLOCK_MONOTONIC,&end);FILE *out=fopen(argv[1],"w");if(!out)return 126;unsigned long long peak=(unsigned long long)usage.ru_maxrss;
#ifndef __APPLE__
peak*=1024;
#endif
double ms=(end.tv_sec-start.tv_sec)*1000.0+(end.tv_nsec-start.tv_nsec)/1000000.0;int code=WIFEXITED(status)?WEXITSTATUS(status):-1,signal=WIFSIGNALED(status)?WTERMSIG(status):0;fprintf(out,"{\"elapsedMs\":%.9f,\"peakMemoryBytes\":%llu,\"exitCode\":%d,\"signal\":%d,\"instrument\":\"CLOCK_MONOTONIC and wait4 ru_maxrss, interpreter included; no separate descendant aggregation\"}\n",ms,peak,code,signal);if(fclose(out))return 126;return code<0?128+signal:code;}
